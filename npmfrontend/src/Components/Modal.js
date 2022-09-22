import styles from "./Modal.module.scss"

export default function Modal(props) {
    const modalState = props.toggle
    const toggleFunc = props.onClickAction

    return (
        <div className={`${styles.container} ${modalState ? styles.active : ''}`}>
            <div className={styles.modal}>
                TODO: Modal content
                <div className={styles.close} onClick={toggleFunc}></div>
            </div>
        </div>
    )
}
