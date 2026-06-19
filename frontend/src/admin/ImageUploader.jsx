import { useRef, useState } from 'react';
import { Upload, X, Star, ImageIcon, Loader2 } from 'lucide-react';
import { uploadImages } from './api.js';

export default function ImageUploader({ value = [], onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const addFiles = async (files) => {
    if (!files || !files.length) return;
    setError('');
    setUploading(true);
    try {
      const urls = await uploadImages(files);
      onChange([...value, ...urls]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const makeCover = (i) => {
    if (i === 0) return;
    const next = [...value];
    const [item] = next.splice(i, 1);
    next.unshift(item);
    onChange(next);
  };

  return (
    <div>
      <div
        className={`uploader ${dragOver ? 'is-drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
        {uploading ? (
          <><Loader2 size={26} className="spin" /><span>กำลังอัปโหลด...</span></>
        ) : (
          <>
            <span className="uploader__icon"><Upload size={24} /></span>
            <span className="uploader__title">แตะเพื่อเลือกรูป หรือถ่ายรูป</span>
            <span className="uploader__hint">ลากรูปมาวางได้ • เลือกหลายรูปพร้อมกัน • รูปแรกคือรูปปก</span>
          </>
        )}
      </div>

      {error && <div className="ad-empty ad-empty--error" style={{ marginTop: 10 }}>{error}</div>}

      {value.length > 0 && (
        <div className="uploader__grid">
          {value.map((src, i) => (
            <div key={src + i} className={`uploader__item ${i === 0 ? 'is-cover' : ''}`}>
              <img src={src} alt="" onError={(e) => { e.target.style.opacity = 0.2; }} />
              {i === 0 && <span className="uploader__cover"><Star size={11} fill="currentColor" /> ปก</span>}
              <div className="uploader__overlay">
                {i !== 0 && (
                  <button type="button" className="uploader__act" title="ตั้งเป็นปก" onClick={() => makeCover(i)}>
                    <Star size={15} />
                  </button>
                )}
                <button type="button" className="uploader__act uploader__act--del" title="ลบ" onClick={() => remove(i)}>
                  <X size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && !uploading && (
        <div className="uploader__empty"><ImageIcon size={16} /> ยังไม่มีรูป</div>
      )}
    </div>
  );
}
