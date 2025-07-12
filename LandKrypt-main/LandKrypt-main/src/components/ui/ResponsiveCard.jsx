// Responsive Card Component
// Adaptive card layouts that work across all screen sizes

import React from 'react';
import { useResponsive } from '../layout/ResponsiveLayout';

// Base Card Component
export function Card({ 
  children, 
  className = '', 
  padding = 'default',
  hover = false,
  clickable = false,
  onClick,
  ...props 
}) {
  const { isMobile, screenSize } = useResponsive();

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    default: isMobile ? 'p-4' : 'p-6',
    lg: isMobile ? 'p-4' : 'p-8'
  };

  const baseClasses = `
    bg-white dark:bg-gray-800 
    rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
    ${paddingClasses[padding]}
    ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
    ${clickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750' : ''}
    ${className}
  `;

  return (
    <div 
      className={baseClasses}
      onClick={clickable ? onClick : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

// Stats Card Component
export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  loading = false 
}) {
  const { isMobile } = useResponsive();

  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card hover>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className={`
            text-sm font-medium text-gray-600 dark:text-gray-400
            ${isMobile ? 'text-xs' : 'text-sm'}
          `}>
            {title}
          </p>
          <p className={`
            font-bold text-gray-900 dark:text-white
            ${isMobile ? 'text-xl' : 'text-2xl'}
          `}>
            {value}
          </p>
          {change && (
            <p className={`
              text-xs font-medium ${changeColors[changeType]}
              ${isMobile ? 'text-xs' : 'text-sm'}
            `}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`
            flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900
            ${isMobile ? 'p-1.5' : 'p-2'}
          `}>
            <Icon className={`
              text-blue-600 dark:text-blue-400
              ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}
            `} />
          </div>
        )}
      </div>
    </Card>
  );
}

// Grid Layout Component
export function ResponsiveGrid({ 
  children, 
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'default',
  className = '' 
}) {
  const gapClasses = {
    sm: 'gap-3',
    default: 'gap-4',
    lg: 'gap-6'
  };

  const gridClasses = `
    grid
    grid-cols-${cols.xs}
    sm:grid-cols-${cols.sm}
    md:grid-cols-${cols.md}
    lg:grid-cols-${cols.lg}
    ${gapClasses[gap]}
    ${className}
  `;

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

// List Card Component
export function ListCard({ 
  title, 
  items = [], 
  renderItem, 
  emptyMessage = 'No items found',
  loading = false,
  maxHeight = 'auto'
}) {
  const { isMobile } = useResponsive();

  if (loading) {
    return (
      <Card>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {title && (
          <h3 className={`
            font-semibold text-gray-900 dark:text-white
            ${isMobile ? 'text-base' : 'text-lg'}
          `}>
            {title}
          </h3>
        )}
        
        <div 
          className={`
            space-y-3 overflow-y-auto
            ${maxHeight !== 'auto' ? `max-h-${maxHeight}` : ''}
          `}
        >
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {emptyMessage}
              </p>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index}>
                {renderItem(item, index)}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

// Chart Card Component
export function ChartCard({ 
  title, 
  children, 
  actions,
  loading = false 
}) {
  const { isMobile } = useResponsive();

  if (loading) {
    return (
      <Card>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`
            font-semibold text-gray-900 dark:text-white
            ${isMobile ? 'text-base' : 'text-lg'}
          `}>
            {title}
          </h3>
          {actions && !isMobile && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
        
        <div className="relative">
          {children}
        </div>
        
        {actions && isMobile && (
          <div className="flex items-center justify-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {actions}
          </div>
        )}
      </div>
    </Card>
  );
}

// Table Card Component
export function TableCard({ 
  title, 
  headers, 
  data = [], 
  renderRow,
  loading = false,
  emptyMessage = 'No data available'
}) {
  const { isMobile } = useResponsive();

  if (loading) {
    return (
      <Card>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (isMobile) {
    // Mobile: Convert table to card list
    return (
      <Card>
        <div className="space-y-4">
          {title && (
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          
          <div className="space-y-3">
            {data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {emptyMessage}
                </p>
              </div>
            ) : (
              data.map((row, index) => (
                <div 
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2"
                >
                  {renderRow(row, index, true)} {/* Pass mobile flag */}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Desktop: Regular table
  return (
    <Card padding="none">
      <div className="space-y-4 p-6">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={headers.length}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {renderRow(row, index, false)} {/* Pass desktop flag */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Action Button Component
export function ActionButton({ 
  children, 
  variant = 'primary', 
  size = 'default',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props 
}) {
  const { isMobile } = useResponsive();

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300'
  };

  const sizes = {
    sm: isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
    default: isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-sm',
    lg: isMobile ? 'px-4 py-2 text-base' : 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-md
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
