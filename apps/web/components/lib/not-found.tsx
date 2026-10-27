import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Link } from "react-router";

const NotFound = () => (
  <Empty>
    <EmptyHeader>
      <EmptyTitle>404: Page not found</EmptyTitle>
      <EmptyDescription>
        This page doesn't exist, or its data isn't in this browser.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button nativeButton={false} render={<Link to="/" />}>
        Back to home
      </Button>
    </EmptyContent>
  </Empty>
);

export default NotFound;
