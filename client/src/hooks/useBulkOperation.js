import { useState, useCallback } from 'react';

export function useBulkOperation() {
  const [bulkState, setBulkState] = useState({
    isOpen: false,
    status: 'IDLE', // 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED'
    operationType: 'APPROVE', // 'APPROVE' | 'DELETE' | 'REJECT'
    title: null,
    total: 0,
    processed: 0,
    successCount: 0,
    failedCount: 0,
    error: null
  });

  const startBulkOperation = useCallback((operationType = 'APPROVE', total = 0, title = null) => {
    setBulkState({
      isOpen: true,
      status: 'PROCESSING',
      operationType,
      title,
      total,
      processed: 0,
      successCount: 0,
      failedCount: 0,
      error: null
    });
  }, []);

  const completeSuccess = useCallback((successCount, total = null) => {
    setBulkState(prev => {
      const finalTotal = total !== null && total !== undefined ? total : prev.total;
      const finalSuccess = successCount !== null && successCount !== undefined ? successCount : finalTotal;
      return {
        ...prev,
        status: 'SUCCESS',
        total: finalTotal,
        processed: finalTotal,
        successCount: finalSuccess,
        failedCount: 0,
        error: null
      };
    });
  }, []);

  const completePartial = useCallback((total, successCount, failedCount) => {
    setBulkState(prev => ({
      ...prev,
      status: 'PARTIAL_SUCCESS',
      total: total !== null && total !== undefined ? total : prev.total,
      processed: total !== null && total !== undefined ? total : prev.total,
      successCount: successCount ?? 0,
      failedCount: failedCount ?? 0,
      error: null
    }));
  }, []);

  const completeFailure = useCallback((errorMessage) => {
    setBulkState(prev => ({
      ...prev,
      status: 'FAILED',
      error: errorMessage || 'An unexpected error occurred.'
    }));
  }, []);

  const closeProgress = useCallback(() => {
    setBulkState(prev => ({
      ...prev,
      isOpen: false,
      status: 'IDLE'
    }));
  }, []);

  return {
    bulkState,
    isBulkProcessing: bulkState.status === 'PROCESSING',
    startBulkOperation,
    completeSuccess,
    completePartial,
    completeFailure,
    closeProgress
  };
}

export default useBulkOperation;
