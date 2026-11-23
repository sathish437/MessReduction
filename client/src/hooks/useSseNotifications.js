import { useState, useEffect, useRef, useCallback } from 'react';
import { getCookie } from '../utils/cookieUtils';

/**
 * Production-ready React hook for Server-Sent Events (SSE).
 * - Connects using fetch streaming with Authorization header & credentials.
 * - Handles auto-reconnect with exponential backoff & Last-Event-ID tracking.
 * - Deduplicates events by applicationId.
 * - Cleans up connections on logout / unmount.
 */
export function useSseNotifications({ onNewRequest } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'

  const onNewRequestRef = useRef(onNewRequest);
  useEffect(() => {
    onNewRequestRef.current = onNewRequest;
  }, [onNewRequest]);

  const seenIdsRef = useRef(new Set());
  const abortControllerRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const lastEventIdRef = useRef('');

  const dismissNotification = useCallback((applicationId) => {
    setNotifications((prev) => prev.filter((item) => item.applicationId !== applicationId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markNotificationRead = useCallback((applicationId) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.applicationId === applicationId ? { ...item, isRead: true } : item
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const connect = useCallback(() => {
    // Abort existing connection if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const token =
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('staffToken') ||
      sessionStorage.getItem('staffToken') ||
      getCookie('staffToken') ||
      getCookie('token');

    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setConnectionStatus('connecting');

    const sseUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/notifications/sse`;

    const headers = {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (lastEventIdRef.current) {
      headers['Last-Event-ID'] = lastEventIdRef.current;
    }

    fetch(sseUrl, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`SSE connection failed with HTTP status ${response.status}`);
        }

        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete trailing line

          let currentEvent = 'message';
          let currentId = '';
          let currentData = '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === '') {
              // Dispatch event block
              if (currentData) {
                handleSseEvent(currentEvent, currentId, currentData);
              }
              currentEvent = 'message';
              currentId = '';
              currentData = '';
              continue;
            }

            if (trimmed.startsWith(':')) {
              // Comment / Ping line
              continue;
            }

            if (trimmed.startsWith('event:')) {
              currentEvent = trimmed.slice(6).trim();
            } else if (trimmed.startsWith('id:')) {
              currentId = trimmed.slice(3).trim();
              if (currentId) {
                lastEventIdRef.current = currentId;
              }
            } else if (trimmed.startsWith('data:')) {
              const dataValue = trimmed.slice(5).trim();
              currentData = currentData ? `${currentData}\n${dataValue}` : dataValue;
            }
          }
        }
      })
      .catch((err) => {
        if (abortController.signal.aborted) {
          return; // Intentional close
        }
        setConnectionStatus('disconnected');

        // Exponential backoff reconnect: 2s, 4s, 8s, up to max 30s
        const attempts = reconnectAttemptsRef.current;
        const delay = Math.min(2000 * Math.pow(1.5, attempts), 30000);
        reconnectAttemptsRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      });
  }, []);

  const handleSseEvent = (eventName, eventId, rawData) => {
    if (eventName === 'heartbeat') {
      return; // Keep-alive pong
    }

    if (eventName === 'connect') {
      return;
    }

    if (eventName === 'new-request' || eventName === 'message') {
      try {
        const payload = JSON.parse(rawData);
        if (!payload || !payload.applicationId) return;

        // Duplicate prevention by unique application ID
        if (seenIdsRef.current.has(payload.applicationId)) {
          return;
        }
        seenIdsRef.current.add(payload.applicationId);

        const newNotification = {
          applicationId: payload.applicationId,
          studentName: payload.studentName || 'Student',
          registerNumber: payload.registerNumber || 'N/A',
          department: payload.department || 'N/A',
          yearOfStudy: payload.yearOfStudy,
          receivedAt: new Date(),
          isRead: false,
        };

        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Notify global bell component to refresh counts
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('app-notification-refresh'));
          window.dispatchEvent(new CustomEvent('sse-new-request', { detail: newNotification }));
        }

        // Trigger real-time callback to refresh the requests table immediately
        if (onNewRequestRef.current) {
          try {
            onNewRequestRef.current(newNotification);
          } catch (callbackErr) {
            console.error('Error in onNewRequest callback:', callbackErr);
          }
        }
      } catch (e) {
        // Failed to parse event JSON
      }
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return {
    notifications,
    unreadCount,
    connectionStatus,
    dismissNotification,
    clearAllNotifications,
    markNotificationRead,
  };
}
