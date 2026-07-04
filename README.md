# Logistica / Paqueteria SOA

Monorepo para la actividad ACT5-C2 de Arquitectura Orientada a Servicios.

El repositorio contiene 3 servicios NestJS independientes a nivel de responsabilidad, contrato, base de datos y despliegue, pero versionados en un unico repositorio para facilitar la entrega academica.

## Servicios

| Servicio | Puerto | Responsabilidad |
|---|---:|---|
| `shipments-service` | `3001` | Orquestador de Saga, JWT, REST y publicacion Redis. |
| `parcels-service` | `3002` | Validacion de paquetes, reserva de etiqueta y compensacion. |
| `routes-service` | `3003` | Cobertura, reserva de ruta y consumidor Redis. |

## Estructura

```txt
logistica-paqueteria-soa/
├─ shipments-service/
├─ parcels-service/
├─ routes-service/
├─ infra-local/
├─ docs/
├─ package.json
└─ pnpm-workspace.yaml
```

## Estrategia de bajo consumo

- Se usa `pnpm` workspace para deduplicar dependencias.
- Docker se reserva para integracion.
- Las imagenes usan Alpine.
- Cada servicio tiene `.dockerignore`.
- No se copian `node_modules` locales a Docker.

## Instalacion

```bash
pnpm install
```

## Desarrollo local por servicio

```bash
pnpm run start:dev:parcels
pnpm run start:dev:routes
pnpm run start:dev:shipments
```

## Docker Compose

Validar Compose sin construir:

```bash
pnpm run compose:config
```

Levantar todo:

```bash
pnpm run compose:up
```

Apagar sin borrar volumenes:

```bash
pnpm run compose:down
```

## Swagger

```txt
Shipments: http://localhost:3001/docs
Parcels:   http://localhost:3002/docs
Routes:    http://localhost:3003/docs
```

## Publicacion en GitHub

Se debe crear un solo repositorio para todo este contenido. Los 3 servicios viven dentro del mismo repo, pero mantienen separacion de responsabilidades y bases de datos.
# SOA_Logistica_paqueteria
