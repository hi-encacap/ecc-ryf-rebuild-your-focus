import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { validateBackup, importBackup } from "../data/store";
import type { AppData } from "../domain/types";
import { perform } from "../App";
export function RestoreBackup({
  onRestored,
  hasData,
}: {
  onRestored: () => void;
  hasData: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<AppData | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  async function read(file?: File) {
    if (!file) return;
    await perform(async () => {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Bản sao lưu vượt quá giới hạn 10 MB.");
      const contents = await file.text();
      setPreview(validateBackup(contents));
      setText(contents);
    });
    if (input.current) input.current.value = "";
  }
  return (
    <>
      <Button
        className="wide"
        variant="ghost"
        onClick={() => input.current?.click()}
      >
        <Upload size={16} /> Đã có dữ liệu? Khôi phục bản sao
      </Button>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => void read(e.target.files?.[0])}
      />
      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent
          title="Khôi phục hành trình của bạn"
          description={
            hasData
              ? "Bản sao sẽ thay thế toàn bộ dữ liệu trên thiết bị. Hãy xuất dữ liệu hiện tại trong Cài đặt trước nếu cần giữ lại."
              : "Dữ liệu được đọc và lưu ngay trên thiết bị, không gửi lên máy chủ."
          }
        >
          {preview && (
            <p className="notice">
              {preview.runs.length} hành trình · {preview.logs.length} ngày ghi
              chép · {preview.cards.length} thẻ nhớ
            </p>
          )}
          <div className="form-actions">
            <Button variant="outline" onClick={() => setPreview(null)}>
              Quay lại
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void perform(async () => {
                  await importBackup(text);
                  setPreview(null);
                  onRestored();
                }, "Đã khôi phục hành trình.").finally(() => setBusy(false));
              }}
            >
              Xác nhận khôi phục
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
