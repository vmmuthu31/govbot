import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function formatDistanceToNow(date: Date | string | number) {
  return dayjs(date).fromNow();
}
