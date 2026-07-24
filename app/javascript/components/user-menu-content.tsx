import { Avatar } from "@astryxdesign/core/Avatar"
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu"
import { router } from "@inertiajs/react"
import { LogOut, Settings } from "lucide-react"

import { sessions, settingsProfiles } from "@/routes"
import type { User } from "@/types"

interface UserMenuContentProps {
  auth: {
    session: {
      id: number
    }
    user: User
  }
}

export function UserMenuContent({ auth }: UserMenuContentProps) {
  const { session, user } = auth

  const handleLogout = () => {
    router.delete(sessions.destroy(session.id).url, {
      onSuccess: () => router.flushAll(),
    })
  }

  return (
    <DropdownMenu
      placement="below"
      menuWidth={224}
      button={{
        label: user.name,
        variant: "ghost",
        icon: <Avatar src={user.avatar} name={user.name} size="sm" />,
        isIconOnly: true,
      }}
      items={[
        {
          label: "Settings",
          icon: Settings,
          onClick: () => router.visit(settingsProfiles.show().url),
        },
        { type: "divider" },
        {
          label: "Log out",
          icon: LogOut,
          onClick: handleLogout,
        },
      ]}
    />
  )
}
