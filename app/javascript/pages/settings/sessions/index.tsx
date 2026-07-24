import { Button } from "@astryxdesign/core/Button"
import { HStack, VStack } from "@astryxdesign/core/Layout"
import { StatusDot } from "@astryxdesign/core/StatusDot"
import {
  Table,
  type TableColumn,
  type TableSortState,
  pixel,
  proportional,
  useTablePagination,
  useTableSortable,
} from "@astryxdesign/core/Table"
import { Text } from "@astryxdesign/core/Text"
import { Head, router, usePage } from "@inertiajs/react"

import { PageHeading } from "@/components/page-heading"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { sessions as sessionsRoutes, settingsSessions } from "@/routes"
import type { BreadcrumbItem, SettingsSessionsIndex } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Sessions",
    href: settingsSessions.index().url,
  },
]

// The index props are recomputed on every visit, so a partial reload only has to
// ask for the table itself.
const TABLE_PROPS = ["sessions", "pagy", "sort_key", "sort_direction"]

// Mirrors Settings::SessionsController's default ordering. A server-rendered
// list always has an order, so clearing the sort falls back here rather than
// leaving the table in an unsorted state the server cannot express.
const DEFAULT_SORT = { key: "created_at", direction: "desc" } as const

type SessionRow = SettingsSessionsIndex["sessions"][number]

export default function Sessions({
  sessions,
  pagy,
  sort_key,
  sort_direction,
}: SettingsSessionsIndex) {
  const { auth } = usePage().props

  const reload = (query: Record<string, string | number>) =>
    router.get(
      settingsSessions.index({ query }).url,
      {},
      { preserveState: true, preserveScroll: true, only: TABLE_PROPS },
    )

  const sort: TableSortState<string> = [
    {
      sortKey: sort_key,
      direction: sort_direction === "asc" ? "ascending" : "descending",
    },
  ]

  const sortable = useTableSortable<SessionRow>({
    sort,
    // Keep the header a two-state toggle. Without this the third click asks for
    // an unsorted table, which server-side ordering cannot represent.
    allowUnsortedState: false,
    // An empty array still arrives from the header's "Clear sort" menu action,
    // and means "back to the default order".
    onSortChange: (next) => {
      const entry = next[0]

      reload({
        page: 1,
        sort: entry?.sortKey ?? DEFAULT_SORT.key,
        direction: entry
          ? entry.direction === "ascending"
            ? "asc"
            : "desc"
          : DEFAULT_SORT.direction,
      })
    },
  })

  const pagination = useTablePagination<SessionRow>({
    page: pagy.page,
    totalItems: pagy.count,
    pageSize: pagy.limit,
    onPageChange: (page) =>
      reload({ page, sort: sort_key, direction: sort_direction }),
  })

  const columns: TableColumn<SessionRow>[] = [
    {
      key: "user_agent",
      header: "Device",
      width: proportional(2),
      sortable: true,
      renderCell: (session) => (
        <Text>{session.user_agent ?? "Unknown device"}</Text>
      ),
    },
    {
      key: "ip_address",
      header: "IP address",
      width: proportional(1),
      sortable: true,
      renderCell: (session) => <Text>{session.ip_address ?? "—"}</Text>,
    },
    {
      key: "created_at",
      header: "Active since",
      width: proportional(1),
      sortable: true,
      renderCell: (session) => (
        <Text>{new Date(session.created_at).toLocaleString()}</Text>
      ),
    },
    {
      key: "actions",
      header: "",
      width: pixel(160),
      align: "end",
      resizable: false,
      renderCell: (session) => {
        if (session.id === auth.session.id) {
          return (
            <HStack gap={1} vAlign="center" hAlign="end">
              <StatusDot variant="success" label="Current session" />
              <Text type="supporting">Current</Text>
            </HStack>
          )
        }

        // `can_destroy` mirrors SessionPolicy#destroy? — the server decides,
        // the table only reflects the decision.
        if (!session.can_destroy) return null

        return (
          <Button
            label="Log out"
            variant="destructive"
            size="sm"
            onClick={() =>
              router.delete(sessionsRoutes.destroy(session.id).url)
            }
          />
        )
      },
    },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <SettingsLayout>
        <VStack gap={6}>
          <PageHeading
            title="Sessions"
            description="Manage your active sessions across devices"
          />

          <Table
            data={sessions}
            columns={columns}
            idKey="id"
            density="balanced"
            hasHover
            textOverflow="truncate"
            plugins={{ sortable, pagination }}
          />
        </VStack>
      </SettingsLayout>
    </AppLayout>
  )
}
