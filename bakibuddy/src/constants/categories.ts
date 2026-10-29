import type { IconName } from "../components/Icon";
import { colors } from "../theme/tokens";
import type { CategoryId } from "../types/finance";

interface Category {
  label: string;
  icon: IconName;
  color: string;
  background: string;
}

export const categories: Record<CategoryId, Category> = {
  food: {
    label: "Food & drinks",
    icon: "restaurant-outline",
    color: colors.orange,
    background: colors.orangeSoft,
  },
  transport: {
    label: "Transport",
    icon: "train-outline",
    color: colors.blue,
    background: colors.blueSoft,
  },
  shopping: {
    label: "Shopping",
    icon: "bag-handle-outline",
    color: colors.purple,
    background: colors.purpleSoft,
  },
  entertainment: {
    label: "Entertainment",
    icon: "film-outline",
    color: colors.purple,
    background: colors.purpleSoft,
  },
  education: {
    label: "Education",
    icon: "book-outline",
    color: colors.blue,
    background: colors.blueSoft,
  },
  bills: {
    label: "Bills",
    icon: "receipt-outline",
    color: colors.amber,
    background: colors.amberSoft,
  },
  subscriptions: {
    label: "Subscriptions",
    icon: "repeat-outline",
    color: colors.purple,
    background: colors.purpleSoft,
  },
  health: {
    label: "Health",
    icon: "medkit-outline",
    color: colors.emerald,
    background: colors.emeraldSoft,
  },
  groceries: {
    label: "Groceries",
    icon: "basket-outline",
    color: colors.emerald,
    background: colors.emeraldSoft,
  },
  other: {
    label: "Other",
    icon: "grid-outline",
    color: colors.secondary,
    background: colors.graySoft,
  },
};
