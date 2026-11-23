import { useQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Spinner } from "@workspace/ui/components/spinner";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { toast } from "sonner";
import useProjectLink from "@/hooks/use-project-link";
import { getScript } from "@/lib/api";
import { networks } from "@/lib/types/network";
import { type ScriptType, scriptTypes } from "@/lib/types/script";
import { type ProjectLink, parseProjectLink } from "@/lib/utils/project-link";

type LinkScript =
  | { id: string; name: string; type: ScriptType }
  | { id: string; missing: true };

// What the link's scripts are, from the API: a script deleted since the link
// was made is listed as missing.
const fetchLinkScripts = (ids: string[]) =>
  Promise.all(
    ids.map(async (id): Promise<LinkScript> => {
      const { script, error } = await getScript(id);
      if (script) {
        return { id, name: script.name, type: script.type };
      }
      // Any other answer is the API failing, not the script being gone.
      if (error?.includes("not found")) {
        return { id, missing: true };
      }
      throw new Error(error ?? "The API didn't answer.");
    }),
  );

const InvalidLink = ({ error }: { error: string }) => (
  <Empty>
    <EmptyHeader>
      <EmptyTitle>This project link can't be opened</EmptyTitle>
      <EmptyDescription>{error}</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button nativeButton={false} render={<Link to="/" />}>
        Back to home
      </Button>
    </EmptyContent>
  </Empty>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="flex flex-col gap-2">
    <h3 className="font-medium text-sm">{title}</h3>
    <ul className="flex flex-col gap-1 text-sm">{children}</ul>
  </section>
);

const ProjectLinkSummary = ({
  link,
  droppedScripts,
  droppedAccounts,
}: {
  link: ProjectLink;
  droppedScripts: number;
  droppedAccounts: number;
}) => {
  const { openProjectLink } = useProjectLink();
  const [opening, setOpening] = useState(false);
  const { data: scripts, error } = useQuery({
    queryKey: ["project-link-scripts", link.scriptIds],
    queryFn: () => fetchLinkScripts(link.scriptIds),
    retry: 1,
  });
  const available = (scripts ?? []).filter(
    (script): script is Extract<LinkScript, { name: string }> =>
      !("missing" in script),
  );
  const missing = (scripts?.length ?? 0) - available.length;
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        {/* The link's author's text: rendered as text, never as markup. */}
        <CardTitle className="break-words text-xl">
          {link.title || "Shared project"}
        </CardTitle>
        <CardDescription>
          A Miden project on {networks[link.networkId]}. Opening it starts a new
          sandbox with your own copies of its scripts, and imports its accounts
          from the chain. The current workspace is replaced: save it first from
          the Projects menu if you want to keep it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Section title="Scripts">
          {scripts === undefined && !error && (
            <li className="flex items-center gap-2 text-muted-foreground">
              <Spinner /> Loading…
            </li>
          )}
          {error && (
            <li className="text-destructive">
              The scripts couldn't be read: {error.message}
            </li>
          )}
          {scripts?.map((script) =>
            "missing" in script ? (
              <li key={script.id} className="text-muted-foreground">
                A script that was deleted
              </li>
            ) : (
              <li
                key={script.id}
                className="flex min-w-0 flex-wrap items-center gap-2"
              >
                <span className="truncate font-mono">{script.name}</span>
                <Badge variant="outline">{scriptTypes[script.type]}</Badge>
              </li>
            ),
          )}
          {droppedScripts > 0 && (
            <li className="text-muted-foreground">
              {droppedScripts === 1
                ? "1 entry of the link isn't a script id: left out."
                : `${droppedScripts} entries of the link aren't script ids: left out.`}
            </li>
          )}
        </Section>
        {(link.accounts.length > 0 || droppedAccounts > 0) && (
          <Section title="Accounts">
            {link.accounts.map(({ name, address }) => (
              <li key={address} className="flex min-w-0 flex-col">
                <span className="break-words">{name}</span>
                <span className="break-all font-mono text-muted-foreground text-xs">
                  {address}
                </span>
              </li>
            ))}
            {droppedAccounts > 0 && (
              <li className="text-muted-foreground">
                {droppedAccounts === 1
                  ? `1 account isn't a ${networks[link.networkId]} address: left out.`
                  : `${droppedAccounts} accounts aren't ${networks[link.networkId]} addresses: left out.`}
              </li>
            )}
          </Section>
        )}
        {missing > 0 && (
          <p className="text-muted-foreground text-sm">
            {available.length > 0
              ? "The rest opens without the deleted scripts."
              : "Every script of this link was deleted: there's nothing to open."}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full sm:w-auto"
          disabled={opening || available.length === 0}
          onClick={async () => {
            setOpening(true);
            const { error, cancelled } = await openProjectLink({
              ...link,
              scriptIds: available.map(({ id }) => id),
            });
            if (error !== undefined) {
              toast.error("The project couldn't be opened.", {
                description: error,
              });
            }
            if (error !== undefined || cancelled) {
              setOpening(false);
            }
          }}
        >
          {opening && <Spinner />}
          {opening ? "Opening…" : "Open project"}
        </Button>
      </CardFooter>
    </Card>
  );
};

// /open#v=1&…: a project link (lib/utils/project-link.ts). Nothing happens
// before the reader presses Open.
const OpenProjectLink = () => {
  const { hash } = useLocation();
  const parsed = parseProjectLink(hash);
  if ("error" in parsed) {
    return <InvalidLink error={parsed.error} />;
  }
  return (
    <div className="flex flex-1 flex-col items-center gap-4 p-4 pt-0">
      <ProjectLinkSummary {...parsed} />
    </div>
  );
};

export default OpenProjectLink;
