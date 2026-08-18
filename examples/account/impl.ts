import type { Shape } from "codeform";
import type * as decisions from "./decisions.gen";

export const acme: Shape<typeof decisions.account> = {
	displayName: "Acme Corp",
	plan: "pro",
	seats: 24,
	admins: [
		"founders@acme.dev",
		"ops@acme.dev",
		"security@acme.dev",
		"billing@acme.dev",
	],
	features: [
		"sso",
		"audit-log",
		"custom-domains",
		"priority-support",
		"data-residency",
	],
};
