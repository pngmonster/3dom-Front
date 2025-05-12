import { useState } from 'react';
import { uploadFile } from '../api/file';

export function useUploadFile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (chatId: string, file: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await uploadFile(chatId, file);
      return res;
    } catch (err) {
      setError(err as Error);
      return {ids:[]}
    } finally {
      setLoading(false);
    }
  };

  return { upload, loading, error };
}