interface Props {
  fName: string;
  lName: string;
  email: string;
  message: string;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}

export const sendContactMessage = async ({
                                           fName, lName, email, message, addToast,
                                         }: Props) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fName, lName, email, message }),
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || 'Failed to send contact message');
    }
    addToast('Send message successfully', 'success', 5000);
  } catch (err) {
    addToast('Failed to send contact message', 'error', 3000);
    if (err instanceof Error) console.error(err.message);
  }
};