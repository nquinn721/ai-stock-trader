import { saveAs } from "file-saver";
import { Story } from "../data/types";

export class FileService {
  /**
   * Format stories data for TypeScript file output
   */
  private static formatStoriesForFile(stories: Story[]): string {
    const header = `// Stories data - Small, focused stories without progress tracking
import { Story } from "./types";

export const stories: Story[] = [`;

    const formattedStories = stories
      .map((story) => {
        // Escape quotes and handle multiline descriptions
        const escapedTitle = story.title.replace(/"/g, '\\"');
        const escapedDescription = story.description
          .replace(/"/g, '\\"')
          .replace(/\n/g, " ")
          .trim();

        // Format dependencies array
        const dependencies =
          story.dependencies.length > 0
            ? `[${story.dependencies.map((dep) => `"${dep}"`).join(", ")}]`
            : "[]";

        // Build the story object string
        let storyString = `  {
    id: "${story.id}",
    title: "${escapedTitle}",
    description:
      "${escapedDescription}",
    status: "${story.status}",
    priority: "${story.priority}",
    epic: "${story.epic}",
    storyPoints: ${story.storyPoints},`;

        if (story.sprint) {
          storyString += `\n    sprint: ${story.sprint},`;
        }

        storyString += `
    assignee: "${story.assignee}",
    progress: ${story.progress},
    dependencies: ${dependencies},
    createdDate: "${story.createdDate}",`;

        if (story.completedDate) {
          storyString += `\n    completedDate: "${story.completedDate}",`;
        }

        storyString += "\n  }";

        return storyString;
      })
      .join(",\n");

    const footer = "\n];";

    return header + "\n" + formattedStories + footer;
  }

  /**
   * Save stories data to a TypeScript file using file-saver
   */
  static saveStoriesFile(
    stories: Story[],
    filename: string = "stories.ts"
  ): void {
    try {
      const fileContent = this.formatStoriesForFile(stories);
      const blob = new Blob([fileContent], {
        type: "text/typescript;charset=utf-8",
      });
      saveAs(blob, filename);
      console.log(`Stories saved to ${filename}`);
    } catch (error) {
      console.error("Error saving stories file:", error);
      throw new Error(
        `Failed to save stories file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Save stories data as JSON for backup
   */
  static saveStoriesAsJSON(
    stories: Story[],
    filename: string = "stories-backup.json"
  ): void {
    try {
      const fileContent = JSON.stringify(stories, null, 2);
      const blob = new Blob([fileContent], {
        type: "application/json;charset=utf-8",
      });
      saveAs(blob, filename);
      console.log(`Stories backup saved to ${filename}`);
    } catch (error) {
      console.error("Error saving stories JSON:", error);
      throw new Error(
        `Failed to save stories JSON: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Create a timestamped backup filename
   */
  static createBackupFilename(
    prefix: string = "stories",
    extension: string = "ts"
  ): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    return `${prefix}-backup-${timestamp}.${extension}`;
  }

  /**
   * Save multiple formats for comprehensive backup
   */
  static saveComprehensiveBackup(stories: Story[]): void {
    try {
      // Save current stories.ts file
      this.saveStoriesFile(stories, "stories.ts");

      // Save timestamped backup
      const backupFilename = this.createBackupFilename();
      this.saveStoriesFile(stories, backupFilename);

      // Save JSON backup
      const jsonBackupFilename = this.createBackupFilename("stories", "json");
      this.saveStoriesAsJSON(stories, jsonBackupFilename);

      console.log("Comprehensive backup completed");
    } catch (error) {
      console.error("Error creating comprehensive backup:", error);
      throw error;
    }
  }

  /**
   * Load stories from a JSON file (for file input)
   */
  static loadStoriesFromFile(file: File): Promise<Story[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const stories = JSON.parse(content) as Story[];

          // Validate the loaded data
          if (!Array.isArray(stories)) {
            throw new Error(
              "Invalid file format: Expected an array of stories"
            );
          }

          // Basic validation for each story
          for (const story of stories) {
            if (!story.id || !story.title || !story.status) {
              throw new Error(
                "Invalid story format: Missing required fields (id, title, status)"
              );
            }
          }

          resolve(stories);
        } catch (error) {
          reject(
            new Error(
              `Failed to parse stories file: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            )
          );
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  }
}
