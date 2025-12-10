import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Project {
  id: string;
  name: string;
  companyName?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const Route = createFileRoute("/(dashboard)/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { refreshKey } = useRouteContext({ from: "/(dashboard)" });
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    description: "",
  });

  useEffect(() => {
    fetchProjects();
  }, [refreshKey]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    setFormData({
      name: "",
      companyName: "",
      description: "",
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      companyName: project.companyName || "",
      description: project.description || "",
    });
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteConfirmation("");
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete || deleteConfirmation.toLowerCase() !== "confirm") {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `http://localhost:3000/api/project/${projectToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete project");
      }

      await fetchProjects();
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
      setDeleteConfirmation("");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete project"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingProject
        ? `http://localhost:3000/api/project/${editingProject.id}`
        : "http://localhost:3000/api/project";
      const method = editingProject ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          companyName: formData.companyName || null,
          description: formData.description || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error ||
            `Failed to ${editingProject ? "update" : "create"} project`
        );
      }

      setFormData({
        name: "",
        companyName: "",
        description: "",
      });
      setEditingProject(null);
      setIsDrawerOpen(false);
      await fetchProjects();
    } catch (error) {
      console.error(
        `Error ${editingProject ? "updating" : "creating"} project:`,
        error
      );
      alert(
        error instanceof Error
          ? error.message
          : `Failed to ${editingProject ? "update" : "create"} project`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground">
            Loading projects...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Projects
              <span className="ml-2 text-muted-foreground font-normal">
                ({projects.length})
              </span>
            </CardTitle>
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <form onSubmit={handleSubmit}>
                  <DrawerHeader>
                    <DrawerTitle>
                      {editingProject ? "Edit Project" : "Create New Project"}
                    </DrawerTitle>
                    <DrawerDescription>
                      {editingProject
                        ? "Update your project information"
                        : "Add a new project to track your work"}
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4">
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="name">Project Name *</FieldLabel>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="e.g., Website Redesign"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="companyName">
                          Company Name (Optional)
                        </FieldLabel>
                        <Input
                          id="companyName"
                          type="text"
                          value={formData.companyName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              companyName: e.target.value,
                            })
                          }
                          placeholder="e.g., Acme Corp"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="description">
                          Description (Optional)
                        </FieldLabel>
                        <Input
                          id="description"
                          type="text"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          placeholder="Brief project description"
                        />
                      </Field>
                    </FieldGroup>
                  </div>
                  <DrawerFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? editingProject
                          ? "Updating..."
                          : "Creating..."
                        : editingProject
                        ? "Update Project"
                        : "Create Project"}
                    </Button>
                    <DrawerClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingProject(null);
                          setFormData({
                            name: "",
                            companyName: "",
                            description: "",
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
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No projects found. Create your first project to get started!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.companyName || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.description || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(project.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(project)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(project)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the project{" "}
              <span className="font-semibold">{projectToDelete?.name}</span>?
              This action cannot be undone. All schedule entries associated with
              this project will have their project reference removed.
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
                setProjectToDelete(null);
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
    </>
  );
}
