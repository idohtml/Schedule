import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectHoursWidgetSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <div className="flex flex-col items-start w-full gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <Skeleton className="mx-auto aspect-square max-h-[250px] rounded-full" />
      </CardContent>
    </Card>
  );
}
