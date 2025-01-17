import { faPlus, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useField } from "formik";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

import { ListBox, ListBoxControlButtonProps, Option } from "components/ui/ListBox";
import { Tooltip } from "components/ui/Tooltip";

import { useConnectorBuilderFormState } from "services/connectorBuilder/ConnectorBuilderStateService";

import { getInferredInputs } from "../types";
import { BuilderField, BuilderFieldProps } from "./BuilderField";
import styles from "./BuilderFieldWithInputs.module.scss";
import { InputForm, newInputInEditing } from "./InputsForm";

export const BuilderFieldWithInputs: React.FC<BuilderFieldProps> = (props) => {
  const [field, , helpers] = useField(props.path);

  return (
    <BuilderField
      {...props}
      adornment={<UserInputHelper setValue={helpers.setValue} currentValue={field.value} />}
      className={styles.inputWithHelper}
    />
  );
};

export const UserInputHelper = ({
  setValue,
  currentValue,
}: {
  setValue: (value: string) => void;
  currentValue: string;
}) => {
  const { formatMessage } = useIntl();
  const [modalOpen, setModalOpen] = useState(false);
  const { builderFormValues } = useConnectorBuilderFormState();
  const listOptions = useMemo(() => {
    const options: Array<Option<string | undefined>> = [
      ...builderFormValues.inputs,
      ...getInferredInputs(builderFormValues),
    ].map((input) => ({
      label: input.definition.title || input.key,
      value: input.key,
    }));
    options.push({
      value: undefined,
      label: formatMessage({ id: "connectorBuilder.inputModal.newTitle" }),
      icon: <FontAwesomeIcon icon={faPlus} />,
    });
    return options;
  }, [builderFormValues, formatMessage]);
  return (
    <>
      <ListBox<string | undefined>
        buttonClassName={styles.button}
        optionClassName={styles.option}
        className={styles.container}
        selectedOptionClassName={styles.selectedOption}
        controlButton={UserInputHelperControlButton}
        selectedValue={undefined}
        onSelect={(selectedValue) => {
          if (selectedValue) {
            setValue(`${currentValue || ""}{{ config['${selectedValue}'] }}`);
          } else {
            // This hack is necessary because listbox will put the focus back when the option list gets hidden, which conflicts with the auto-focus setting of the modal.
            // As it's not possible to prevent listbox from forcing the focus back on the button component, this will wait until the focus went to the button, then opens the modal
            // so it can move it to the first input
            setTimeout(() => {
              setModalOpen(true);
            }, 50);
          }
        }}
        options={listOptions}
      />
      {modalOpen && (
        <InputForm
          inputInEditing={newInputInEditing()}
          onClose={(newInput) => {
            setModalOpen(false);
            if (!newInput) {
              return;
            }
            setValue(`${currentValue}{{ config['${newInput.key}'] }}`);
          }}
        />
      )}
    </>
  );
};

const UserInputHelperControlButton: React.FC<ListBoxControlButtonProps<string | undefined>> = () => {
  return (
    <Tooltip
      control={
        <div className={styles.buttonContent}>
          {"{{"}
          <FontAwesomeIcon icon={faUser} />
          {"}}"}
        </div>
      }
      placement="top"
    >
      <FormattedMessage id="connectorBuilder.interUserInputValue" />
    </Tooltip>
  );
};
