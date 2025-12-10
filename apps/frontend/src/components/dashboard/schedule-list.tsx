import { useState, useEffect } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import type { ScheduleEntry } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ScheduleList() {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "17:00",
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setIsLoadingSchedules(true);
      const response = await fetch("http://localhost:3000/api/schedule", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }

      const result = await response.json();
      if (result.success) {
        setSchedules(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const handleEdit = (entry: ScheduleEntry) => {
    // Format date for input (YYYY-MM-DD)
    const dateStr = new Date(entry.date).toISOString().split("T")[0];
    // Format time for input (HH:MM) - remove seconds if present
    const startTimeStr = entry.startTime.split(":").slice(0, 2).join(":");
    const endTimeStr = entry.endTime.split(":").slice(0, 2).join(":");

    setFormData({
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
    });
    setEditingEntry(entry);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingEntry
        ? `http://localhost:3000/api/schedule/${editingEntry.id}`
        : "http://localhost:3000/api/schedule";
      const method = editingEntry ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          date: formData.date,
          startTime: `${formData.startTime}:00`,
          endTime: `${formData.endTime}:00`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error ||
            `Failed to ${editingEntry ? "update" : "create"} schedule entry`
        );
      }

      // Reset form and close drawer
      setFormData({
        date: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "17:00",
      });
      setEditingEntry(null);
      setIsDrawerOpen(false);

      // Refresh schedules
      await fetchSchedules();
    } catch (error) {
      console.error(
        `Error ${editingEntry ? "updating" : "creating"} schedule entry:`,
        error
      );
      alert(
        error instanceof Error
          ? error.message
          : `Failed to ${editingEntry ? "update" : "create"} schedule entry`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-muted/40 min-h-screen flex-1 rounded-2xl md:min-h-min p-2">
      <div className="bg-background rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <div />
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" onClick={handleCreate}>
                Add Entry
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <form onSubmit={handleSubmit}>
                <DrawerHeader>
                  <DrawerTitle>
                    {editingEntry
                      ? "Edit Schedule Entry"
                      : "Add Schedule Entry"}
                  </DrawerTitle>
                  <DrawerDescription>
                    {editingEntry
                      ? "Update your work hours for this day"
                      : "Track your work hours for a specific day"}
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="date">Date</FieldLabel>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            date: e.target.value,
                          })
                        }
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="startTime">Start Time</FieldLabel>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startTime: e.target.value,
                          })
                        }
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="endTime">End Time</FieldLabel>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            endTime: e.target.value,
                          })
                        }
                        required
                      />
                    </Field>
                  </FieldGroup>
                </div>
                <DrawerFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? editingEntry
                        ? "Updating..."
                        : "Creating..."
                      : editingEntry
                      ? "Update Entry"
                      : "Create Entry"}
                  </Button>
                  <DrawerClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingEntry(null);
                        setFormData({
                          date: new Date().toISOString().split("T")[0],
                          startTime: "09:00",
                          endTime: "17:00",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>
        </div>
        {isLoadingSchedules && schedules.length === 0 ? (
          // Suspense fallback will show during initial load
          null
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No schedule entries found. Add your first entry to get started!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {formatDate(entry.date)}
                  </TableCell>
                  <TableCell>{formatTime(entry.startTime)}</TableCell>
                  <TableCell>{formatTime(entry.endTime)}</TableCell>
                  <TableCell>{entry.totalHours} hrs</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
