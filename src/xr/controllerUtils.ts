export type ControllerCollection =
  | Map<any, any>
  | Array<any>
  | Record<string, any>
  | undefined
  | null;

export type Handedness = "left" | "right" | null;

type ControllerIterator = (controller: any, handedness: Handedness) => void;

function resolveHandedness(controller: any, fallback?: any): Handedness {
  const hand =
    controller?.handedness ??
    controller?.inputSource?.handedness ??
    controller?.controller?.handedness ??
    controller?.grip?.handedness ??
    fallback;

  if (hand === "left" || hand === "right") {
    return hand;
  }

  return null;
}

export function forEachController(
  controllers: ControllerCollection,
  iteratee: ControllerIterator,
): void {
  if (!controllers) return;

  if (typeof (controllers as any).forEach === "function") {
    (controllers as any).forEach((value: any, key: any) => {
      iteratee(value, resolveHandedness(value, key));
    });
    return;
  }

  if (Array.isArray(controllers)) {
    controllers.forEach((controller) => {
      iteratee(controller, resolveHandedness(controller));
    });
    return;
  }

  Object.entries(controllers).forEach(([key, controller]) => {
    iteratee(controller, resolveHandedness(controller, key));
  });
}

export function getControllerByHand(
  controllers: ControllerCollection,
  hand: "left" | "right",
): any | undefined {
  let result: any | undefined;
  forEachController(controllers, (controller, controllerHand) => {
    if (!result && controllerHand === hand) {
      result = controller;
    }
  });
  return result;
}

export function getHandednessForController(controller: any, fallback?: any): Handedness {
  return resolveHandedness(controller, fallback);
}
