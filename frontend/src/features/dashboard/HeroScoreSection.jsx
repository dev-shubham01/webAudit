import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { bandStyles, cardShell, heroMessage, scoreBand } from "./dashboard.utils";

export default function HeroScoreSection({ overallScore, scoreLabel }) {
  const heroBand = scoreBand(overallScore);
  const hero = bandStyles[heroBand];

  return (
    <Card className={`${cardShell} overflow-hidden ring-1 ${hero.ring} ${hero.border}`}>
      <div className={`h-1.5 w-full ${hero.bar}`} />
      <CardContent className="px-6 py-10 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
          Overall health score
        </p>
        <div
          className={`mt-2 text-7xl font-bold tabular-nums tracking-tight sm:text-8xl ${hero.text}`}
        >
          {Math.round(overallScore)}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Badge className={`${hero.bg} ${hero.text} border-0 px-3 py-1 text-sm font-semibold`}>
            {scoreLabel ?? "—"}
          </Badge>
        </div>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-[#CBD5E1]">
          {heroMessage(overallScore)}
        </p>
      </CardContent>
    </Card>
  );
}
