"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface Project {
  id: string;
  name: string;
  companyName?: string | null;
  description?: string | null;
}

interface ProjectWithHours extends Project {
  totalHours: number;
}

interface ProjectHoursWidgetProps {
  refreshKey?: number;
}

export function ProjectHoursWidget({ refreshKey }: ProjectHoursWidgetProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsWithHours, setProjectsWithHours] = useState<
    ProjectWithHours[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    name: "",
    companyName: "",
    description: "",
  });

  useEffect(() => {
    fetchProjects();
  }, [refreshKey]);

  useEffect(() => {
    if (projects.length > 0) {
      fetchAllProjectHours();
    }
  }, [projects]);

  useEffect(() => {
    if (projects.length > 0 && refreshKey !== undefined) {
      fetchAllProjectHours();
    }
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

  const fetchAllProjectHours = async () => {
    try {
      const hoursPromises = projects.map(async (project) => {
        try {
          const response = await fetch(
            `http://localhost:3000/api/project/${project.id}/hours?period=all`,
            {
              credentials: "include",
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch hours for ${project.name}`);
          }

          const result = await response.json();
          if (result.success) {
            return {
              ...project,
              totalHours: parseFloat(result.data.totalHours) || 0,
            };
          }
          return { ...project, totalHours: 0 };
        } catch (error) {
          console.error(`Error fetching hours for ${project.name}:`, error);
          return { ...project, totalHours: 0 };
        }
      });

      const projectsWithHoursData = await Promise.all(hoursPromises);
      setProjectsWithHours(projectsWithHoursData);
    } catch (error) {
      console.error("Error fetching project hours:", error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch("http://localhost:3000/api/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: projectFormData.name,
          companyName: projectFormData.companyName || null,
          description: projectFormData.description || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create project");
      }

      const result = await response.json();
      if (result.success) {
        // Reset form and close dialog
        setProjectFormData({
          name: "",
          companyName: "",
          description: "",
        });
        setIsCreateDialogOpen(false);

        // Refresh projects
        await fetchProjects();
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create project"
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return null; // Suspense will handle loading
  }

  // Sort projects by hours (highest first)
  const sortedProjects = [...projectsWithHours].sort(
    (a, b) => b.totalHours - a.totalHours
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <div className="flex items-center justify-between w-full">
          <CardTitle>Projects</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Project
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[250px] gap-4 text-muted-foreground">
            <p>No projects yet</p>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : sortedProjects.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            Loading project hours...
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedProjects.map((project) => (
              <button
                key={project.id}
                className="w-full text-left px-4 py-3 rounded-lg border transition-colors"
                style={{
                  backgroundColor:
                    "color-mix(in oklch, var(--chart-1) 20%, transparent)",
                  borderColor: "var(--chart-1)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {project.companyName
                        ? `${project.name} (${project.companyName})`
                        : project.name}
                    </span>
                  </div>
                  <span className="font-semibold text-sm tabular-nums">
                    {project.totalHours.toFixed(1)} hrs
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateProject}>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to track your work hours
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="project-name">Project Name *</FieldLabel>
                  <Input
                    id="project-name"
                    value={projectFormData.name}
                    onChange={(e) =>
                      setProjectFormData({
                        ...projectFormData,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Website Redesign"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="company-name">
                    Company Name (Optional)
                  </FieldLabel>
                  <Input
                    id="company-name"
                    value={projectFormData.companyName}
                    onChange={(e) =>
                      setProjectFormData({
                        ...projectFormData,
                        companyName: e.target.value,
                      })
                    }
                    placeholder="e.g., Acme Corp"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="project-description">
                    Description (Optional)
                  </FieldLabel>
                  <Input
                    id="project-description"
                    value={projectFormData.description}
                    onChange={(e) =>
                      setProjectFormData({
                        ...projectFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief project description"
                  />
                </Field>
              </FieldGroup>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setProjectFormData({
                    name: "",
                    companyName: "",
                    description: "",
                  });
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
