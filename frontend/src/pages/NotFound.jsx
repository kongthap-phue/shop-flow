import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-bold">ไม่พบหน้านี้</h1>
      <Link to="/" className="btn-primary mt-6">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
