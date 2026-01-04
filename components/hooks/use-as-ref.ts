import * as React from "react";

function useAsRef<T>(value: T): React.MutableRefObject<T> {
    const ref = React.useRef<T>(value);

    React.useLayoutEffect(() => {
        ref.current = value;
    }, [value]);

    return ref;
}

export { useAsRef };
