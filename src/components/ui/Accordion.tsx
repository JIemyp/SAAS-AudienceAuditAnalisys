import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
    title: React.ReactNode;
    children: React.ReactNode;
    isOpen?: boolean;
    onToggle?: () => void;
    className?: string;
}

export function AccordionItem({
    title,
    children,
    isOpen,
    onToggle,
    className,
}: AccordionItemProps) {
    return (
        <div className={cn("border-b border-border last:border-0", className)}>
            <button
                onClick={onToggle}
                className="flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:text-accent"
            >
                {title}
                <ChevronDown
                    className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: "auto" },
                            collapsed: { opacity: 0, height: 0 },
                        }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                        <div className="pb-4 pt-0">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface AccordionProps {
    items: {
        id: string;
        title: React.ReactNode;
        content: React.ReactNode;
    }[];
    allowMultiple?: boolean;
    className?: string;
}

export function Accordion({
    items,
    allowMultiple = false,
    className,
}: AccordionProps) {
    const [openIds, setOpenIds] = React.useState<string[]>([]);

    const toggle = (id: string) => {
        if (allowMultiple) {
            setOpenIds((prev) =>
                prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
            );
        } else {
            setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
        }
    };

    return (
        <div className={cn("w-full", className)}>
            {items.map((item) => (
                <AccordionItem
                    key={item.id}
                    title={item.title}
                    isOpen={openIds.includes(item.id)}
                    onToggle={() => toggle(item.id)}
                >
                    {item.content}
                </AccordionItem>
            ))}
        </div>
    );
}
