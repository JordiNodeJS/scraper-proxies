# Prompt: Creación de Componentes React

## 🎯 Objetivo

Generar componentes React modernos y reutilizables siguiendo las mejores prácticas del proyecto.

## 📋 Checklist para Componentes

### Estructura Básica

- [ ] Componente funcional con TypeScript
- [ ] Props interface bien definida
- [ ] Exportación por defecto
- [ ] JSDoc para documentación

### Styling

- [ ] Clases Tailwind CSS
- [ ] Responsive design (mobile-first)
- [ ] Estados hover/focus/active
- [ ] Consistencia con design system

### Funcionalidad

- [ ] Hooks apropiados (useState, useEffect, custom hooks)
- [ ] Event handlers tipados
- [ ] Error boundaries cuando sea necesario
- [ ] Accesibilidad (ARIA labels, semantic HTML)

### Performance

- [ ] React.memo cuando sea apropiado
- [ ] useCallback para handlers
- [ ] useMemo para cálculos costosos
- [ ] Lazy loading para componentes pesados

## 🔧 Template Base

```typescript
import React, { memo } from "react";

interface ComponentNameProps {
  // Props aquí con JSDoc
  /**
   * Descripción de la prop
   */
  propName: string;
  onAction?: (data: any) => void;
  className?: string;
}

/**
 * Descripción del componente
 *
 * @param props - Las props del componente
 * @returns JSX.Element
 */
const ComponentName: React.FC<ComponentNameProps> = memo(
  ({ propName, onAction, className = "" }) => {
    // Estado local
    // Custom hooks
    // Handlers

    return <div className={`base-classes ${className}`}>{/* Contenido */}</div>;
  }
);

ComponentName.displayName = "ComponentName";

export default ComponentName;
```

## 🎨 Patrones de Styling

### Clases Base Comunes

```typescript
// Botones
const buttonStyles = {
  base: "px-4 py-2 rounded-lg font-medium transition-colors duration-200",
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
  danger: "bg-red-600 hover:bg-red-700 text-white",
};

// Cards
const cardStyles = "bg-white rounded-lg shadow-md border border-gray-200 p-6";

// Inputs
const inputStyles =
  "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
```

## 🔄 Patrones de Estado

### Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

if (isLoading) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
```

### Error States

```typescript
if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <p className="text-red-800">{error}</p>
    </div>
  );
}
```

## 📊 Componentes Específicos del Proyecto

### ProxyTable

- Paginación integrada
- Sorting por columnas
- Filtros en tiempo real
- Virtualización para performance

### ActionButton

- Estados: idle, loading, validating, complete
- Indicadores visuales de progreso
- Disable apropiado según estado

### StatusIndicator

- Colores semánticos (verde=válido, rojo=inválido, amarillo=validando)
- Tooltips informativos
- Animaciones sutiles

## ⚡ Performance Tips

1. **Memoización inteligente**: Solo memo componentes que renderizan frecuentemente
2. **Event handlers**: useCallback para handlers que se pasan como props
3. **Lazy loading**: React.lazy para componentes que no se muestran inicialmente
4. **Virtualización**: Para listas de > 100 items usar react-window

## 🧪 Testing Considerations

- Componentes deben ser testeable unitariamente con `bun test`
- Props requeridas vs opcionales bien definidas
- Handlers mockeables
- Estados edge case manejados
- Setup con `bunx vitest` para testing de componentes
- Usar `@testing-library/react` instalado con `bun add -D`
