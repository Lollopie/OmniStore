import { api } from '../../../api/client.ts';

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
    await api.post('/contact', { fName, lName, email, message });
    addToast('Send message successfully', 'success', 5000);
  } catch (err) {
    addToast('Failed to send contact message', 'error', 3000);
    if (err instanceof Error) console.error(err.message);
  }
};