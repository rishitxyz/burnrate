import {
  showToast as neoShowToast,
  ToastContainer as NeoToastContainer,
} from '@cred/neopop-web/lib/components';

export { NeoToastContainer as ToastContainer };

export const toast = {
  success: (message: string, _duration?: number) => {
    neoShowToast(message, {
      type: 'success',
      dismissOnClick: true,
      autoCloseTime: _duration ?? 4000,
      colorConfig: { background: '#06C270', color: '#ffffff' },
    });
  },
  error: (message: string, _duration?: number) => {
    neoShowToast(message, {
      type: 'error',
      dismissOnClick: true,
      autoCloseTime: _duration ?? 5000,
      colorConfig: { background: '#EE4D37', color: '#ffffff' },
    });
  },
  info: (message: string, _duration?: number) => {
    neoShowToast(message, {
      type: 'warning',
      dismissOnClick: true,
      autoCloseTime: _duration ?? 4000,
      colorConfig: { background: '#FF8744', color: '#ffffff' },
    });
  },
  loading: (message: string) => {
    neoShowToast(message, {
      type: 'warning',
      dismissOnClick: false,
      autoCloseTime: 0,
      colorConfig: { background: '#FF8744', color: '#ffffff' },
    });
    return message;
  },
  dismiss: (_id: string) => {
    // NeoPOP toast doesn't support programmatic dismiss by ID
    // Toast will auto-close or be dismissed on click
  },
};
