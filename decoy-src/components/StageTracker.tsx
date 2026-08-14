export function StageTracker({ stages, current }: { stages: string[]; current: string }) {
  const currentIndex = stages.indexOf(current);

  return (
    <div className="flex" role="img" aria-label={`Stage: ${current}`}>
      {stages.map((stage, i) => {
        const isFirst = i === 0;
        const isLast = i === stages.length - 1;
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        const clipPath = isFirst
          ? 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)'
          : isLast
            ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%)'
            : 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)';

        return (
          <div
            key={stage}
            className={`flex h-9 flex-1 items-center justify-center text-xs font-medium ${
              isActive
                ? 'bg-blue-700 text-white'
                : isDone
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-500'
            }`}
            style={{ clipPath, marginLeft: isFirst ? 0 : -14 }}
          >
            {stage}
          </div>
        );
      })}
    </div>
  );
}
