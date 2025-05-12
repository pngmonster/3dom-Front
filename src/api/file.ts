import axios from "axios";
import {ContextOut} from "./types"


export async function uploadFile(chatId: string, file: File): Promise<{ ids: string[] }> {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('file', file);

  const res = await axios.post(`https://giicoo.ru/api/file-service/uploadfile/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}