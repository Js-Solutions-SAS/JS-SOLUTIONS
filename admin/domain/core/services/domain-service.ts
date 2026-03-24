export interface DomainService<TData, TMutationEvent, TMutationResult, TViewModel> {
  load: () => Promise<TData>;
  mutate: (event: TMutationEvent) => Promise<TMutationResult>;
  mapError: (error: unknown) => string;
  toViewModel: (data: TData) => TViewModel;
}
