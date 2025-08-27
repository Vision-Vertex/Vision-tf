# Job Search & Discovery System

## Overview

The Job Search & Discovery System provides advanced job search functionality with full-text search, filtering, and discovery features for developers and clients. This system is built on top of the existing job schema without requiring any database changes.

## Features

### 🔍 **Advanced Search**
- **Full-text search** using PostgreSQL's built-in full-text search capabilities
- **Multi-field filtering** by skills, budget, location, status, priority, and more
- **Complex JSON filtering** for skills and budget fields
- **Pagination and sorting** with relevance scoring

### 🎯 **Smart Filtering**
- **Status filtering**: PUBLISHED, APPROVED, IN_PROGRESS, etc.
- **Priority filtering**: LOW, MEDIUM, HIGH, URGENT
- **Project type filtering**: WEB_DEVELOPMENT, MOBILE_DEVELOPMENT, DESIGN, etc.
- **Location filtering**: REMOTE, ONSITE, HYBRID
- **Skills filtering**: Required and preferred skills with level and weight
- **Budget filtering**: Type, amount range, and currency
- **Time-based filtering**: Deadline and creation date ranges

### 🚀 **Performance Features**
- **Database indexing** leveraging existing indexes
- **Efficient queries** using Prisma ORM
- **Relevance scoring** for better result ranking
- **Pagination** for large result sets

### 💡 **Discovery Features**
- **Search suggestions** for autocomplete functionality
- **Trending jobs** based on priority, recency, and deadline
- **Quick search** for simple text queries
- **Filter metadata** for building search interfaces

## API Endpoints

### 1. **Advanced Job Search**
```
POST /jobs/search
```
**Description**: Perform advanced job search with full filtering capabilities
**Body**: `JobSearchQueryDto` with search parameters
**Response**: `JobSearchResponseDto` with paginated results and relevance scores

### 2. **Search Suggestions**
```
GET /jobs/search/suggestions?q={query}&limit={limit}
```
**Description**: Get search suggestions for autocomplete
**Query Parameters**:
- `q`: Search query (required)
- `limit`: Maximum suggestions to return (default: 10)
**Response**: `SearchSuggestionsResponseDto` with skill, tag, and title suggestions

### 3. **Trending Jobs**
```
GET /jobs/search/trending?limit={limit}
```
**Description**: Get trending/popular jobs
**Query Parameters**:
- `limit`: Maximum jobs to return (default: 10)
**Response**: Array of `JobSearchResultDto` with relevance scores

### 4. **Quick Search**
```
GET /jobs/search/quick?q={query}&page={page}&limit={limit}
```
**Description**: Perform quick search with minimal parameters
**Query Parameters**:
- `q`: Search query (required)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
**Response**: `JobSearchResponseDto` with search results

### 5. **Available Filters**
```
GET /jobs/search/filters
```
**Description**: Get available search filters and options
**Response**: Object with available statuses, priorities, project types, locations, skills, and tags

## Data Transfer Objects (DTOs)

### **JobSearchQueryDto**
Comprehensive search query with all filtering options:
- Text search query
- Status, priority, project type filters
- Skills and budget filters
- Pagination and sorting parameters
- Boolean flags for common filters

### **JobSearchResultDto**
Enhanced job result with search-specific fields:
- All standard job fields
- Relevance score (0.0 - 1.0)
- Truncated description for search results
- Client information

### **SearchSuggestionsResponseDto**
Autocomplete suggestions with:
- Skill suggestions
- Tag suggestions
- Title suggestions
- Relevance scores for ranking

## Implementation Details

### **PostgreSQL Full-Text Search**
- Uses PostgreSQL's `tsvector`/`tsquery` for efficient text search
- Automatic word stemming and ranking
- Configurable search weights and relevance

### **JSON Field Filtering**
- Skills filtering using JSON path operators
- Budget filtering with amount ranges and type matching
- Efficient database queries without schema changes

### **Relevance Scoring Algorithm**
- **Base score**: 0.5 for all jobs
- **Text match boost**: +0.3 for title matches, +0.1 for description matches
- **Priority boost**: +0.2 for URGENT, +0.1 for HIGH
- **Recency boost**: +0.1 for jobs created within 7 days, +0.05 for 30 days
- **Deadline boost**: +0.15 for jobs due within 7 days, +0.1 for 30 days
- **Score capping**: Maximum score of 1.0

### **Performance Optimizations**
- Leverages existing database indexes
- Efficient pagination with `skip`/`take`
- Parallel execution of count and data queries
- Minimal memory usage with streaming results

## Integration

### **Existing System**
- **No schema changes** required
- **Extends existing JobService** functionality
- **Uses existing authentication** and authorization
- **Follows established patterns** for DTOs and responses

### **Module Structure**
```
src/job/search/
├── dto/
│   └── search.dto.ts          # Search DTOs and validation
├── search.service.ts           # Search business logic
├── search.controller.ts        # Search API endpoints
├── search.module.ts            # Module configuration
├── index.ts                    # Export declarations
└── README.md                   # This documentation
```

### **Dependencies**
- **PrismaModule**: Database access and ORM
- **AuthModule**: Authentication and authorization
- **Existing Job Models**: Leverages current schema

## Usage Examples

### **Basic Text Search**
```typescript
const searchQuery: JobSearchQueryDto = {
  query: 'React developer needed',
  page: 1,
  limit: 20,
  sortBy: 'relevance',
  sortOrder: 'desc'
};

const results = await searchService.searchJobs(searchQuery);
```

### **Advanced Filtering**
```typescript
const searchQuery: JobSearchQueryDto = {
  query: 'full stack developer',
  status: [JobStatus.PUBLISHED, JobStatus.APPROVED],
  priority: [JobPriority.HIGH, JobPriority.URGENT],
  location: [WorkLocation.REMOTE],
  requiredSkills: [
    { skill: 'React', level: 'EXPERT', minWeight: 0.8 }
  ],
  budget: {
    type: 'FIXED',
    minAmount: 5000,
    maxAmount: 15000,
    currency: 'USD'
  },
  remoteOnly: true,
  urgentOnly: true
};
```

### **Getting Suggestions**
```typescript
const suggestions = await searchService.getSearchSuggestions('React', 10);
// Returns skill, tag, and title suggestions with relevance scores
```

## Future Enhancements

### **Potential Improvements**
- **Elasticsearch integration** for advanced search capabilities
- **Search analytics** and trending analysis
- **Personalized search** based on user preferences
- **Search result caching** for improved performance
- **Advanced relevance algorithms** using machine learning

### **Scalability Considerations**
- **Database query optimization** for large datasets
- **Search result caching** strategies
- **Load balancing** for high-traffic scenarios
- **Search index optimization** for better performance

## Testing

The search system includes comprehensive unit tests covering:
- Search query building and filtering
- Relevance score calculation
- Suggestion generation
- Error handling and edge cases
- Performance testing with large datasets

Run tests with:
```bash
npm test -- --testPathPatterns=search
```

## Conclusion

The Job Search & Discovery System provides a robust, scalable solution for job search functionality without requiring any changes to the existing database schema. It leverages PostgreSQL's advanced features and integrates seamlessly with the current system architecture.

The implementation focuses on:
- **Performance**: Efficient queries and indexing
- **Flexibility**: Comprehensive filtering options
- **User Experience**: Smart relevance scoring and suggestions
- **Maintainability**: Clean, well-documented code
- **Scalability**: Ready for future enhancements
