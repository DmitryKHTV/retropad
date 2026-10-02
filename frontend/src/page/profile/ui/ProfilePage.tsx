import Link from "next/link";
import {Button, StatusMessage} from "@/shared/ui";

/** Placeholder for the profile page, which the navbar already links to. */
export const ProfilePage = () => (
    <main>
        <StatusMessage
            title="Profile is coming soon"
            hint="Account settings will live here."
            actions={<Link href="/"><Button outline>Back to boards</Button></Link>}
        />
    </main>
);
