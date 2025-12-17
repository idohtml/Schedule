import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRefreshKey } from "@/hooks/use-refresh-key";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  companyName?: string | null;
  description?: string | null;
  hourlyRate?: string | null;
  createdAt: string;
  updatedAt: string;
  totalHours: string;
  entryCount: number;
  schedules: Schedule[];
}

interface Schedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: string;
  notes?: string | null;
}

export const Route = createFileRoute("/(dashboard)/projects/$projectId")({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const { refreshKey } = useRefreshKey();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [projectId, refreshKey]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `http://localhost:3000/api/project/${projectId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Project not found");
        } else {
          setError("Failed to fetch project");
        }
        return;
      }

      const result = await response.json();
      if (result.success) {
        setProject(result.data);
      } else {
        setError("Failed to fetch project");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      setError("Failed to fetch project");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // Format HH:MM
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading project...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground">
            Loading project details...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground">
            {error || "Project not found"}
          </div>
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/projects" })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group schedules by date
  const schedulesByDate = project.schedules.reduce((acc, schedule) => {
    // Handle both ISO string and Date object formats
    const dateStr =
      typeof schedule.date === "string"
        ? schedule.date.split("T")[0]
        : new Date(schedule.date).toISOString().split("T")[0];
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  // Calculate total hours per date
  const dateTotals = Object.entries(schedulesByDate).map(
    ([date, schedules]) => {
      const totalHours = schedules.reduce(
        (sum, s) => sum + parseFloat(s.totalHours),
        0
      );
      return { date, schedules, totalHours };
    }
  );

  // Sort by date descending
  dateTotals.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/projects" })}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.companyName && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Company:
              </span>{" "}
              <span className="text-sm">{project.companyName}</span>
            </div>
          )}
          {project.description && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Description:
              </span>{" "}
              <span className="text-sm">{project.description}</span>
            </div>
          )}
          {project.hourlyRate && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Hourly Rate:
              </span>{" "}
              <span className="text-sm">
                {parseFloat(project.hourlyRate).toFixed(2)} SEK
              </span>
            </div>
          )}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Total Hours
                  </div>
                  <div className="text-2xl font-semibold">
                    {parseFloat(project.totalHours).toFixed(2)}h
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Total Entries
                  </div>
                  <div className="text-2xl font-semibold">
                    {project.entryCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {project.schedules.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No schedule entries found for this project.
            </div>
          ) : (
            <div className="space-y-6">
              {dateTotals.map(({ date, schedules, totalHours }) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <h3 className="font-semibold text-lg">
                      {formatDate(date)}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      Total: {totalHours.toFixed(2)}h
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>
                            {formatTime(schedule.startTime)}
                          </TableCell>
                          <TableCell>{formatTime(schedule.endTime)}</TableCell>
                          <TableCell>
                            {parseFloat(schedule.totalHours).toFixed(2)}h
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {schedule.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
