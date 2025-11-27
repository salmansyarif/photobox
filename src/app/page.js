import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-800 to-blue-600 overflow-hidden">

      {/* STATIC BLUE RADIATION (NO ANIMATION) */}
      <div className="absolute inset-0">
        <div className="absolute w-[600px] h-[600px] bg-blue-400/40 rounded-full blur-[200px] top-[-120px] left-[-100px]"></div>
        <div className="absolute w-[500px] h-[500px] bg-cyan-300/40 rounded-full blur-[180px] bottom-[-140px] right-[-80px]"></div>
      </div>

      <main className="relative z-10 flex flex-col items-center gap-10">

        {/* FOTO / LOGO */}
        <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-[0_0_35px_rgba(0,150,255,0.6)] border-4 border-blue-300/60 hover:scale-105 transition-transform duration-300">
          <Image
            src="/vo.jpg"
            alt="Logo Volab"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* TEXT */}
        <h1 className="text-4xl font-bold text-white drop-shadow-[0_0_12px_rgba(0,180,255,0.6)]">
          Selamat Datang
        </h1>

        {/* BUTTON */}
        <Link
          href="/frame"
          className="px-10 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold text-lg shadow-[0_0_25px_rgba(0,140,255,0.7)] hover:shadow-[0_0_40px_rgba(0,150,255,1)] transition-all duration-300"
        >
          Masuk
        </Link>

      </main>
    </div>
  );
}
