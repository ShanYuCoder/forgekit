/*
 * Structurizr DSL — pilot skeleton (Phase B).
 * SSOT for prose/IDs remains MD under architecture/ + product/ (see MODEL.md).
 * IDs mirror docs hub: admin, web, CMP-01.
 */
workspace "base-docs platform" "arc42 × C4 pilot model" {

    !identifiers hierarchical

    model {
        op = person "Admin operator" "Uses Admin web to manage platform/tenant data"

        admin = softwareSystem "Admin Product" "Admin product boundary" {
            web = container "Admin Web" "Admin SPA / FE" "Nuxt/Next" {
                auth = component "CMP-01 Auth" "Authentication module" "Vue/React"
            }
            api = container "Admin API" "Admin HTTP API" "Nest/FastAPI" {
                authApi = component "CMP-01 Auth API" "Auth endpoints" "Node"
            }
            db = container "Admin DB" "Storage" "PostgreSQL" "Database"
        }

        idp = softwareSystem "IdP / session" "External identity / session issuer" {
            tags "External"
        }

        op -> web "Uses"
        web -> api "HTTPS JSON"
        api -> idp "Authenticates"
        authUi -> authApi "POST login"
    }

    views {
        systemLandscape "LND-base" {
            include *
            autoLayout lr
        }

        systemContext admin "Landscape" {
            include *
            autoLayout lr
        }

        container admin "Containers" {
            include *
            autoLayout tb
        }

        component web "CMP-01-web" {
            include *
            autoLayout lr
        }

        component api "CMP-01-api" {
            include *
            autoLayout lr
        }

        dynamic admin "FLOW-login" {
            op -> web "Open login W-AD-AUTH-001"
            web -> api "POST login API-AD-AUTH-001"
            api -> idp "Validate credentials"
            api -> web "session / token"
            web -> op "Authenticated shell"
            autoLayout
        }

        themes default
    }

}
