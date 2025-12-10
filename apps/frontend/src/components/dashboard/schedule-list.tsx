import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 15;

interface Project {
  id: string;
  name: string;
  companyName?: string | null;
}

interface ScheduleListProps {
  refreshKey?: number;
}

export function ScheduleList({ refreshKey }: ScheduleListProps) {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<ScheduleEntry | null>(
    null
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "17:00",
    projectId: "",
  });

  useEffect(() => {
    fetchSchedules();
    fetchProjects();
  }, [refreshKey]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/project", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const result = await response.json();
      if (result.success) {
        setProjects(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

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
      projectId: entry.projectId || "",
    });
    setEditingEntry(entry);
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (entry: ScheduleEntry) => {
    setEntryToDelete(entry);
    setDeleteConfirmation("");
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete || deleteConfirmation.toLowerCase() !== "confirm") {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `http://localhost:3000/api/schedule/${entryToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete schedule entry");
      }

      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      setEntryToDelete(null);
      setDeleteConfirmation("");

      // Refresh schedules
      await fetchSchedules();

      // Adjust pagination if needed
      const remainingItems = schedules.length - 1;
      const newTotalPages = Math.ceil(remainingItems / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (error) {
      console.error("Error deleting schedule entry:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete schedule entry"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
      projectId: "",
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
          projectId: formData.projectId || null,
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
        projectId: "",
      });
      setEditingEntry(null);
      setIsDrawerOpen(false);

      // Refresh schedules
      await fetchSchedules();
      // Reset to first page after creating/updating
      setCurrentPage(1);
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

  // Calculate pagination
  const totalPages = Math.ceil(schedules.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSchedules = useMemo(() => {
    return schedules.slice(startIndex, endIndex);
  }, [schedules, startIndex, endIndex]);

  // Reset to page 1 when schedules change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [schedules.length, totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
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
                    <Field>
                      <FieldLabel htmlFor="project">
                        Project (Optional)
                      </FieldLabel>
                      <Select
                        value={formData.projectId || undefined}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            projectId: value === "none" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger id="project">
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.companyName
                                ? `${project.name} (${project.companyName})`
                                : project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          projectId: "",
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
        {isLoadingSchedules &&
        schedules.length === 0 ? null : schedules.length === 0 ? ( // Suspense fallback will show during initial load
          <div className="p-8 text-center text-muted-foreground">
            No schedule entries found. Add your first entry to get started!
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSchedules.map((entry) => {
                  const project = entry.projectId
                    ? projects.find((p) => p.id === entry.projectId)
                    : null;
                  const projectName = project
                    ? project.companyName
                      ? `${project.name} (${project.companyName})`
                      : project.name
                    : "-";

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {projectName}
                      </TableCell>
                      <TableCell>{formatTime(entry.startTime)}</TableCell>
                      <TableCell>{formatTime(entry.endTime)}</TableCell>
                      <TableCell>{entry.totalHours} hrs</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(entry)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="p-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) {
                            handlePageChange(currentPage - 1);
                          }
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) {
                            handlePageChange(currentPage + 1);
                          }
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the schedule entry for{" "}
              <span className="font-semibold">
                {entryToDelete ? formatDate(entryToDelete.date) : ""}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Field>
              <FieldLabel htmlFor="delete-confirm">
                Type <span className="font-mono font-semibold">confirm</span> to
                delete:
              </FieldLabel>
              <Input
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="confirm"
                autoFocus
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    deleteConfirmation.toLowerCase() === "confirm"
                  ) {
                    handleDeleteConfirm();
                  }
                }}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setEntryToDelete(null);
                setDeleteConfirmation("");
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={
                deleteConfirmation.toLowerCase() !== "confirm" || isDeleting
              }
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
