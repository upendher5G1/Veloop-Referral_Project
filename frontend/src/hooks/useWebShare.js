export function useWebShare() {
  const isSupported = typeof navigator !== 'undefined' && !!navigator.share;

  const share = async ({ title, text, url }) => {
    if (isSupported) {
      try {
        await navigator.share({ title, text, url });
        return { success: true };
      } catch (err) {
        return { success: false, cancelled: err.name === 'AbortError' };
      }
    }
    return { success: false, unsupported: true };
  };

  return { share, isSupported };
}
