const SiteClosed = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#1a1050] to-[#24243e] px-4 text-center">
      <div className="w-full max-w-md">
        <img
          src="https://cdn.poehali.dev/projects/e7ddf8f6-b608-452a-9939-9f00b8f5a4d9/files/b6d4276c-23be-4d44-ad86-71dc814ef421.jpg"
          alt="Сайт на доработке"
          className="mx-auto mb-8 w-56 h-56 rounded-3xl object-cover shadow-2xl shadow-purple-900/60 ring-1 ring-white/10"
        />

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-purple-300 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          Временно недоступен
        </div>

        <h1 className="mt-4 font-display text-3xl font-bold text-white leading-tight">
          Сайт находится<br />на доработке
        </h1>

        <p className="mt-4 text-base text-white/60 leading-relaxed">
          Просим вас не беспокоиться — мы работаем над улучшением сервиса.<br />
          <span className="text-white/40 text-sm">Сроки завершения работ нам неизвестны.</span>
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm text-sm text-white/50">
          <p className="font-medium text-white/70 mb-2">Остались вопросы?</p>
          <a
            href="https://t.me/zaymiplus263"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.496.969z"/>
            </svg>
            Написать в Telegram @zaymiplus263
          </a>
        </div>

        <p className="mt-6 text-xs text-white/25">© {new Date().getFullYear()} ООО МКК «Займы Плюс»</p>
      </div>
    </div>
  );
};

export default SiteClosed;
