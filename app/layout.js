import './globals.css';
import { Be_Vietnam_Pro } from 'next/font/google';
const font = Be_Vietnam_Pro({ subsets: ['vietnamese', 'latin'], weight: ['400', '500', '700'] });
export const metadata = { title: 'Đạo tràng Pháp Hoa' };
export default function RootLayout({ children }) {
  return <html lang="vi"><body className={font.className}>{children}</body></html>;
}
