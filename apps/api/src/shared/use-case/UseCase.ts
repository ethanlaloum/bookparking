export interface UseCase<S, T> {
  execute(props: S): T;
}
