import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Settings } from "lucide-react";
import {
  DEFAULT_FONT_SIZE,
  FONT_SIZES,
  updateEditorSettings,
  useEditorSettings,
} from "@/lib/editor-settings";

// The gear in the tabs row: settings for every editor of the page.
const EditorSettingsMenu = () => {
  const { minimap, fontSize } = useEditorSettings();
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          delay={300}
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editor settings"
                />
              }
            />
          }
        >
          <Settings />
        </TooltipTrigger>
        <TooltipContent>Editor settings</TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="w-44" align="end">
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={minimap}
            onCheckedChange={(checked) =>
              updateEditorSettings({ minimap: checked })
            }
          >
            Minimap
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Font size</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={fontSize}
            onValueChange={(value: number) =>
              updateEditorSettings({ fontSize: value })
            }
          >
            {FONT_SIZES.map((size) => (
              <DropdownMenuRadioItem key={size} value={size}>
                {size} px{size === DEFAULT_FONT_SIZE && " (default)"}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EditorSettingsMenu;
