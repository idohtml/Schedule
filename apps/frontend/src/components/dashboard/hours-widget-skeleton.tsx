import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function HoursWidgetSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24 mt-2" />
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <Skeleton className="mx-auto aspect-square max-h-[250px] rounded-full" />
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </CardFooter>
    </Card>
  );
}
