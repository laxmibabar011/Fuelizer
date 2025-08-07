import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../utils/cn";

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}) => (
  <TabsPrimitive.Root
    defaultValue={defaultValue}
    value={value}
    onValueChange={onValueChange}
    className={cn("w-full", className)}
  >
    {children}
  </TabsPrimitive.Root>
);

const TabsList: React.FC<TabsListProps> = ({ children, className }) => (
  <TabsPrimitive.List
    className={cn(
      "inline-flex h-12 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      className
    )}
  >
    {children}
  </TabsPrimitive.List>
);

const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className,
  disabled,
}) => (
  <TabsPrimitive.Trigger
    value={value}
    disabled={disabled}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white",
      className
    )}
  >
    {children}
  </TabsPrimitive.Trigger>
);

const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className,
}) => (
  <TabsPrimitive.Content
    value={value}
    className={cn(
      "mt-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
  >
    {children}
  </TabsPrimitive.Content>
);

export { Tabs, TabsList, TabsTrigger, TabsContent };
