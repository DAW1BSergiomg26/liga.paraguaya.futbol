"use client";
import { StructuredData } from "@/types";
import ClubCard from "./ClubCard";
import MatchFormCard from "./MatchFormCard";
import H2HCard from "./H2HCard";
import MiniTableCard from "./MiniTableCard";
import ComparisonCard from "./ComparisonCard";
import NextMatchCard from "./NextMatchCard";
import PredictionCard from "./PredictionCard";

interface Props {
  data: StructuredData;
}

export default function RichCardRouter({ data }: Props) {
  if (!data || data.type === "greeting" || data.type === "unknown") return null;

  switch (data.type) {
    case "club_detail":
      return <ClubCard data={data} />;
    case "match_form":
      return <MatchFormCard data={data} />;
    case "h2h":
      return <H2HCard data={data} />;
    case "mini_table":
      return <MiniTableCard data={data} />;
    case "comparison":
      return <ComparisonCard data={data} />;
    case "next_match":
      return <NextMatchCard data={data} />;
    case "prediction":
      return <PredictionCard data={data} />;
    default:
      return null;
  }
}
