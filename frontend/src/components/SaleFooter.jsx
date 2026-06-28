import { MapPin } from 'lucide-react';
import logo from '../logo_rungniran.png';

export default function SaleFooter() {
  return (
    <footer className="sitefoot">
      <div className="sitefoot__inner">
        <div className="sitefoot__brand">
          <img src={logo} alt="รุ่งนิรันดร์กลการ" />
          <div>
            <div className="sitefoot__name">บริษัท รุ่งนิรันดร์กลการ จำกัด</div>
            <div className="sitefoot__addr">
              <MapPin size={14} />
              15 ม.11 ถ.รอบเมืองอุดร-หนองคาย ตำบลกุดสระ อำเภอเมือง อุดรธานี 41000
            </div>
          </div>
        </div>
        <div className="sitefoot__copy">
          © {new Date().getFullYear()} บริษัท รุ่งนิรันดร์กลการ จำกัด · สงวนลิขสิทธิ์
        </div>
      </div>
    </footer>
  );
}
