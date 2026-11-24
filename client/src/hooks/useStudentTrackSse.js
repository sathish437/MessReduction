import { useState, useEffect, useRef, useCallback } from 'react';
import { getCookie } from '../utils/cookieUtils';

/**
 * Production-ready React hook for Student Application Tracking Server-Sent Events (SSE).
 * - Connects to /api/student-form/sse/track using browser-native EventSource API.
 * - Subscribes to authenticated studentId updates.
 * - Reconnects automatically with exponential backoff on drop.
 * - Cleans up connections on unmount or when student changes.
 * - Reports connectionStatus: 'connected' | 'reconnecting' | 'disconnected'.
 */
export function useStudentTrackSse({ studentId, onTrackUpdate }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected' | 'reconnecting' | 'disconnected'
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const onTrackUpdateRef = useRef(onTrackUpdate);

  useEffect(() => {
    onTrackUpdateRef.current = onTrackUpdate;
  }, [onTrackUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (isMountedRef.current) {
      setConnectionStatus('disconnected');
    }
  }, []);

  const connect = useCallback(() => {
    if (!studentId) {
      disconnect();
      return;
    }

    const token =
      sessionStorage.getItem('token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token') ||
      getCookie('token');

    if (!token) {
      disconnect();
      return;
    }

    // Clean up any existing connection before creating a new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (isMountedRef.current) {
      setConnectionStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'reconnecting');
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const sseUrl = `${apiBase}/api/student-form/sse/track?studentId=${encodeURIComponent(studentId)}&token=${encodeURIComponent(token)}`;

    try {
      const es = new EventSource(sseUrl, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMountedRef.current) {
          es.close();
          return;
        }
        reconnectAttemptsRef.current = 0;
        setConnectionStatus('connected');
      };

      es.addEventListener('connect', () => {
        if (!isMountedRef.current) return;
        reconnectAttemptsRef.current = 0;
        setConnectionStatus('connected');
      });

      es.addEventListener('heartbeat', () => {
        if (isMountedRef.current && connectionStatus !== 'connected') {
          setConnectionStatus('connected');
        }
      });

      es.addEventListener('track-update', (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (onTrackUpdateRef.current) {
            onTrackUpdateRef.current(data);
          }
        } catch (err) {
          console.error('[StudentTrackSSE] Failed to parse track-update event payload:', err);
        }
      });

      es.onerror = () => {
        if (!isMountedRef.current) return;
        
        // Immediately close the native EventSource to stop the browser's tight internal retry loop
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        reconnectAttemptsRef.current += 1;

        // If backend is down or connection refused, stop hammering after 5 attempts
        if (reconnectAttemptsRef.current >= 5) {
          setConnectionStatus('disconnected');
          return;
        }

        setConnectionStatus('reconnecting');

        // Schedule next retry with exponential backoff (3s, 6s, 12s, 24s...)
        const delay = Math.min(3000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
        reconnectTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, delay);
      };
    } catch (err) {
      console.error('[StudentTrackSSE] Failed to initialize EventSource:', err);
      if (isMountedRef.current) {
        setConnectionStatus('disconnected');
      }
    }
  }, [studentId, disconnect]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionStatus,
    reconnect: connect,
    disconnect
  };
}
