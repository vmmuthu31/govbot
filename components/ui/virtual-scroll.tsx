import { useInView } from "react-intersection-observer";
import { useState, useEffect, useCallback } from "react";

interface VirtualScrollProps<T> {
  items: T[];
  renderItem: (item: T) => JSX.Element;
  pageSize?: number;
}

export function VirtualScroll<T>({
  items,
  renderItem,
  pageSize = 10,
}: VirtualScrollProps<T>) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { ref, inView } = useInView({
    threshold: 0,
  });

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    const end = page * pageSize;
    const nextBatch = items.slice(0, end);
    setVisibleItems(nextBatch);
    setHasMore(end < items.length);
    setPage((p) => p + 1);
  }, [items, page, pageSize, hasMore]);

  useEffect(() => {
    setPage(1);
    loadMore();
  }, [items, loadMore]);

  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map(renderItem)}
      </div>
      {hasMore && (
        <div ref={ref} className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
