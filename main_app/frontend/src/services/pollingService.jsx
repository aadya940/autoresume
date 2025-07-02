const POLLING_INTERVAL = 400; // 0.4 second polling since `manual editing` completes in `<1 second`.

export const startPolling = (onStatusUpdate, onError) => {
  let isPolling = true;
  let timeoutId = null;

  const poll = async () => {
    if (!isPolling) return;

    try {
      const response = await fetch('http://localhost:8000/api/pdf-status');
      const data = await response.json();
      onStatusUpdate(data.ready);
    } catch (error) {
      onError(error);
    } finally {
      if (isPolling) {
        timeoutId = setTimeout(poll, POLLING_INTERVAL);
      }
    }
  };

  // Start polling
  poll();

  // Return cleanup function
  return () => {
    isPolling = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};
