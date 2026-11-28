export function presenceWarmth(homeCount: number, totalCount: number): string {
  const ratio = totalCount ? homeCount / totalCount : 0;
  return `radial-gradient(120% 100% at 0% 100%, hsl(24 95% 62% / ${0.12 + ratio * 0.38}), transparent 70%), radial-gradient(90% 80% at 100% 0%, hsl(330 80% 70% / ${0.08 + ratio * 0.2}), transparent 70%)`;
}
