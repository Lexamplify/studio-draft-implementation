"use client";

import type { Project } from "@/types/index";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  isCreateCard?: boolean;
}

const ProjectIcon = ({ type, className }: { type: Project["iconType"], className?: string }) => {
  if (type === 'book') {
    return <Icons.BookOpen className={cn("h-16 w-16 text-muted-foreground group-hover:text-primary", className)} />;
  }
  return <Icons.ProjectFolder className={cn("h-16 w-16 text-muted-foreground group-hover:text-primary", className)} />;
};

const AccessIcon = ({ type, className }: { type: Project["accessType"], className?: string }) => {
  if (type === 'shared') {
    return <Icons.Users className={cn("h-4 w-4 text-muted-foreground", className)} />;
  }
  return <Icons.Lock className={cn("h-4 w-4 text-muted-foreground", className)} />;
};

export default function ProjectCard({ project, onClick, isCreateCard }: ProjectCardProps) {
  return (
    <Card
      className={cn(
        "group relative flex flex-col cursor-pointer overflow-hidden transition-all h-full border-0 shadow-md hover:shadow-xl hover:scale-[1.025] bg-white",
        isCreateCard ? "border-2 border-dashed border-blue-300 bg-blue-50/40 hover:bg-blue-100/60 hover:border-blue-500" : "hover:border-blue-400"
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-2">
        {isCreateCard ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="rounded-full bg-blue-100 p-4 mb-2">
              <Icons.Plus className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-blue-700 mb-1">{project.title}</h3>
            <p className="text-sm text-blue-500 mb-2">{project.subtitle}</p>
          </div>
        ) : (
          <>
            <div className="mb-2 mt-2">
              <ProjectIcon type={project.iconType} />
            </div>
            <h3 className="text-md font-semibold text-gray-900 mb-1 truncate w-full">{project.title}</h3>
            {project.subtitle && (
              <p className="text-xs text-gray-500 mb-2 truncate w-full">{project.subtitle}</p>
            )}
            <div className="text-xs text-gray-400 mb-2 w-full flex flex-col items-center gap-0.5">
              {project.petitionerName && <span>Petitioner: {project.petitionerName}</span>}
              {project.respondentName && <span>Respondent: {project.respondentName}</span>}
              {project.lastModified && <span>Last Modified: {project.lastModified}</span>}
            </div>
            <p className="text-xs text-gray-400">
              {project.fileCount} files
            </p>
            <div className="absolute bottom-3 right-3">
              <AccessIcon type={project.accessType} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
