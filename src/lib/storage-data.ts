export type Category = "developer" | "system" | "media" | "apps" | "documents" | "other";
export type DiskNode = {
  id: string; name: string; size: number; category: Category; type: "folder" | "file";
  modified: string; accessed: string; safe?: boolean; protected?: boolean; children?: DiskNode[];
};

const GB = 1_000_000_000;
const TB = 1_000 * GB;
const node = (id: string, name: string, gb: number, category: Category, type: "folder" | "file", extra: Partial<DiskNode> = {}): DiskNode => ({ id, name, size: gb * GB, category, type, modified: "Sep 18, 2026 at 9:42 AM", accessed: "Sep 20, 2026 at 6:18 PM", ...extra });

export const volumes = [
  { id: "mac", name: "Macintosh HD", subtitle: "APFS Container", total: 994 * GB, used: 642 * GB },
  { id: "t7", name: "Samsung T7", subtitle: "External SSD", total: 2 * TB, used: 1.14 * TB },
  { id: "icloud", name: "iCloud Drive", subtitle: "Cloud Storage", total: 200 * GB, used: 126 * GB },
];

export const diskRoot: DiskNode = node("root", "Macintosh HD", 642, "system", "folder", { children: [
  node("users", "Users", 318.2, "documents", "folder", { children: [
    node("alex", "alex", 312.4, "documents", "folder", { children: [
      node("library", "Library", 128.6, "developer", "folder", { children: [
        node("developer", "Developer", 76.8, "developer", "folder", { children: [
          node("xcode", "Xcode", 42.7, "developer", "folder", { children: [
            node("derived", "DerivedData", 24.8, "developer", "folder", { safe: true, children: [node("build", "Build", 14.2, "developer", "folder", { safe: true }), node("index", "Index.noindex", 6.8, "developer", "folder", { safe: true }), node("logs", "Logs", 3.8, "developer", "folder", { safe: true })] }),
            node("archives", "Archives", 9.6, "developer", "folder"), node("sim", "iOS DeviceSupport", 8.3, "developer", "folder", { safe: true })
          ] }),
          node("docker", "Docker", 18.4, "developer", "folder", { safe: true }), node("npm", "node_modules", 11.2, "developer", "folder", { safe: true }), node("pods", "CocoaPods", 4.5, "developer", "folder", { safe: true })
        ] }),
        node("caches", "Caches", 31.4, "system", "folder", { safe: true, children: [node("safari", "com.apple.Safari", 8.6, "system", "folder", { safe: true }), node("chrome", "Google Chrome", 12.8, "system", "folder", { safe: true }), node("adobe-cache", "Adobe Media Cache", 10, "media", "folder", { safe: true })] }),
        node("support", "Application Support", 20.4, "apps", "folder")
      ] }),
      node("movies", "Movies", 82.7, "media", "folder", { children: [node("finalcut", "Final Cut Library.fcpbundle", 46.8, "media", "file"), node("clips", "4K Drone Footage", 28.4, "media", "folder"), node("screen", "Screen Recordings", 7.5, "media", "folder", { safe: true })] }),
      node("documents", "Documents", 54.9, "documents", "folder", { children: [node("projects", "Client Projects", 31.2, "documents", "folder"), node("archives-zip", "Archives", 14.7, "documents", "folder", { safe: true }), node("design", "Design Library", 9, "documents", "folder")] }),
       node("downloads", "Downloads", 28.1, "other", "folder", { children: [node("xcode-dmg", "Xcode_16.0.dmg", 12.4, "apps", "file", { safe: true }), node("duplicate-xcode-dmg", "Xcode_16.0 copy.dmg", 8.4, "apps", "file", { safe: true }), node("duplicate-archive", "Project Assets copy.zip", 4.3, "documents", "file", { safe: true }), node("duplicate-installer", "CreativeCloud Installer (1).dmg", 2.1, "apps", "file", { safe: true }), node("misc", "Unsorted", 0.9, "other", "folder")] }),
      node("pictures", "Pictures", 18.1, "media", "folder")
    ] })
  ] }),
  node("applications", "Applications", 142.6, "apps", "folder", { children: [node("xcode-app", "Xcode.app", 28.7, "apps", "folder"), node("adobe", "Adobe Creative Cloud", 24.3, "apps", "folder"), node("games", "Games", 41.8, "apps", "folder"), node("utilities", "Utilities", 12.4, "apps", "folder"), node("other-apps", "Other Applications", 35.4, "apps", "folder")] }),
  node("system", "System", 96.4, "system", "folder", { protected: true, children: [node("system-lib", "Library", 51.2, "system", "folder", { protected: true }), node("cores", "CoreServices", 28.8, "system", "folder", { protected: true }), node("preboot", "Preboot", 16.4, "system", "folder", { protected: true })] }),
  node("private", "private", 42.9, "system", "folder", { children: [node("vm", "vm", 18.2, "system", "folder"), node("var", "var", 24.7, "system", "folder", { safe: true })] }),
  node("library-root", "Library", 33.7, "system", "folder"),
  node("other-root", "Other Volumes", 8.2, "other", "folder")
] });

export const formatSize = (size: number) => size >= TB ? `${(size / TB).toFixed(2)} TB` : size >= GB ? `${(size / GB).toFixed(size >= 100 * GB ? 0 : 1)} GB` : `${(size / 1_000_000).toFixed(0)} MB`;
export const flatten = (root: DiskNode): DiskNode[] => [root, ...(root.children?.flatMap(flatten) ?? [])];
export const findNode = (root: DiskNode, id: string): DiskNode | undefined => root.id === id ? root : root.children?.map((child) => findNode(child, id)).find(Boolean);
export const findPath = (root: DiskNode, id: string): DiskNode[] | undefined => { if (root.id === id) return [root]; for (const child of root.children ?? []) { const result = findPath(child, id); if (result) return [root, ...result]; } return undefined; };
